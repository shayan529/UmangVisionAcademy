import React from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  GraduationCap,
  CheckCircle,
  BookOpen,
  BarChart2,
  Trophy,
  ChevronLeft,
  Shield,
  UploadCloud,
  FileQuestion,
  Film,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../redux/slices/authSlice";
import { Lock } from "lucide-react";

const AdminSidebar = ({
  tab,
  setTab,
  applicationsCount = 0,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const navItems = [
    { id: "overview", label: t("adminSidebar.overview"), icon: BarChart2 },
    { id: "leaderboard", label: t("adminSidebar.leaderboard"), icon: Trophy },
    { id: "students", label: t("adminSidebar.students"), icon: Users },
    { id: "instructors", label: t("adminSidebar.instructors"), icon: GraduationCap },
    { id: "courses", label: t("adminSidebar.courses"), icon: BookOpen },
    { id: "question-papers", label: t("adminSidebar.questionPapers"), icon: FileQuestion },
    { id: "bulk-import", label: t("adminSidebar.bulkImport"), icon: UploadCloud },
    { id: "notes", label: t("adminSidebar.notes"), icon: BookOpen },
    { id: "reels", label: t("adminSidebar.reels"), icon: Film },
    {
      id: "applications",
      label: t("adminSidebar.applications"),
      icon: CheckCircle,
      badge: applicationsCount,
    },
    { id: "roles", label: t("adminSidebar.roles"), icon: Lock },
    { id: "devices", label: t("adminSidebar.devices"), icon: Shield },
  ];

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-[#0b1120] border-r border-slate-800 flex flex-col transition-all duration-300 z-40
          ${collapsed ? "w-[68px] min-w-[68px]" : "w-[220px] min-w-[220px]"}
          ${
            mobileOpen
              ? "fixed top-0 bottom-[82px] left-0 shadow-2xl"
              : "hidden md:flex md:relative md:h-auto"
          }
        `}
      >
        {/* Brand & Collapse Header */}
        <div className="flex items-center justify-between mb-5 px-3 py-4 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-indigo-500/20">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                  {t("adminSidebar.panel")}
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-black font-extrabold text-sm">
              S
            </div>
          )}
          <button
            onClick={() => {
              setCollapsed((c) => !c);
              if (mobileOpen) setMobileOpen(false);
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-white transition"
          >
            <ChevronLeft
              size={14}
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* User Card */}
        <div className="px-3 mb-4">
          <div
            className={`flex items-center gap-3 rounded-xl p-3 ${
              collapsed ? "justify-center" : "justify-start"
            } bg-indigo-950/20 border border-indigo-900/30`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-violet-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/10">
              AD
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="truncate text-xs font-bold text-white">
                  Admin User
                </div>
                <div className="text-[10px] text-indigo-400 font-semibold">
                  Administrator
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pb-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  if (mobileOpen) setMobileOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 w-full text-left ${
                  collapsed ? "justify-center" : "justify-start"
                } ${
                  isActive
                    ? "bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && (
                  <span className="text-xs font-semibold flex-1">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge > 0 && (
                  <span className="bg-red-500 text-white rounded-full text-[9px] font-bold px-2 py-0.5 min-w-4.5 text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
