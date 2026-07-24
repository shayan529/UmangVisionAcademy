import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Home, MessageSquare, FileText, Play, User } from "lucide-react";

export default function MobileBottomBar() {
  const { pathname } = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const getProfileLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "staff") return "/staff-dashboard";
    if (user.role === "instructor") return "/instructor-dashboard";
    return "/student-dashboard/settings";
  };

  const navItems = [
    { path: "/", label: t("bottomBar.home", "Home"), icon: Home },
    { path: "/mobile/chat", label: t("bottomBar.chat", "Chat"), icon: MessageSquare },
    { path: "/mobile/notes", label: t("bottomBar.notes", "Notes"), icon: FileText },
    { path: "/mobile/reels", label: t("bottomBar.reels", "Reels"), icon: Play },
    { path: getProfileLink(), label: t("bottomBar.profile", "Profile"), icon: User },
  ];

  // Remove accidental duplicate entries (same label+path)
  const uniqueNavItems = navItems.filter(
    (item, idx, arr) =>
      arr.findIndex((i) => i.label === item.label && i.path === item.path) ===
      idx,
  );
  // Debug log to help diagnose duplicate renders in runtime
  // if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  //   // eslint-disable-next-line no-console
  //   console.debug(
  //     "MobileBottomBar navItems:",
  //     navItems,
  //     "unique:",
  //     uniqueNavItems,
  //   );
  // }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
      <div className="w-full rounded-t-2xl border-t border-white/10 bg-slate-950/95 p-2 pb-safe-offset shadow-2xl backdrop-blur-xl flex items-center justify-around">
        {uniqueNavItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition duration-200"
            >
              <div
                className={`flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${isActive
                    ? "bg-indigo-500/20 text-indigo-400 scale-110 shadow-lg shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <Icon size={20} className={isActive ? "animate-pulse" : ""} />
              </div>
              <span
                className={`text-[10px] mt-1 font-bold tracking-wide transition-all duration-300 ${isActive
                    ? "text-indigo-300 opacity-100 scale-105"
                    : "text-slate-500 opacity-80"
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
