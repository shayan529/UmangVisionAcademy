import React, { useState } from "react";
import {
  Search,
  Laptop,
  Smartphone,
  Globe,
  MapPin,
  Phone,
  Calendar,
  Users,
  Shield,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────── */
const hue = (name = "?") => {
  const palette = [
    "#7c3aed",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
  ];
  return palette[name.charCodeAt(0) % palette.length];
};

/* ─── Avatar ──────────────────────────────────────────── */
const Av = ({ name = "?", size = 42 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: hue(name),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 800,
      color: "#fff",
      flexShrink: 0,
      letterSpacing: "-0.02em",
    }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

/* ─── User Agent Parser ─────────────────────────────── */
const parseUA = (userAgent) => {
  if (!userAgent)
    return { browser: "Unknown Browser", os: "Unknown OS", isMobile: false };
  const ua = userAgent.toLowerCase();
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let isMobile = false;

  // OS Detection
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("macintosh") || ua.includes("mac os")) {
    os = "macOS";
  } else if (ua.includes("android")) {
    os = "Android";
    isMobile = true;
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
    isMobile = true;
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  // Browser Detection
  if (ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("chrome") || ua.includes("crios")) {
    browser = "Chrome";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("opr") || ua.includes("opera")) {
    browser = "Opera";
  }

  return { browser, os, isMobile };
};

const AdminDevices = ({ users = [], loading = false, currentUser }) => {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedUserAgents, setExpandedUserAgents] = useState({});

  const toggleUA = (deviceId) => {
    setExpandedUserAgents((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  const currentIsAdmin = currentUser?.roles?.includes("admin");
  const visibleUsers = currentIsAdmin
    ? users
    : users.filter((u) => !u.roles?.includes("admin"));

  const filteredUsers = visibleUsers.filter((u) => {
    // 1. Filter by search query
    const ql = q.toLowerCase();
    const matchesQuery =
      u.name?.toLowerCase().includes(ql) ||
      u.email?.toLowerCase().includes(ql) ||
      u.city?.toLowerCase().includes(ql) ||
      u.state?.toLowerCase().includes(ql) ||
      u.pincode?.toLowerCase().includes(ql) ||
      u.phoneNumber?.toLowerCase().includes(ql);

    // 2. Filter by role
    if (roleFilter === "students") {
      return matchesQuery && u.roles?.includes("student");
    }
    if (roleFilter === "instructors") {
      return matchesQuery && u.roles?.includes("instructor");
    }
    if (roleFilter === "admins") {
      return matchesQuery && u.roles?.includes("admin");
    }
    return matchesQuery;
  });

  const studentsCount = visibleUsers.filter((u) =>
    u.roles?.includes("student"),
  ).length;
  const instructorsCount = visibleUsers.filter((u) =>
    u.roles?.includes("instructor"),
  ).length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-1">
            Security & Access Logs
          </p>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Logged In Devices
            <span className="text-sm font-semibold text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-2 py-0.5 mt-0.5">
              {filteredUsers.length} listed
            </span>
          </h2>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            className="w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition duration-150"
            placeholder="Search name, email, phone, location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setRoleFilter("all")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 ${
            roleFilter === "all"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold"
              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          All Users ({visibleUsers.length})
        </button>
        <button
          onClick={() => setRoleFilter("students")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 ${
            roleFilter === "students"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold"
              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Students ({studentsCount})
        </button>
        <button
          onClick={() => setRoleFilter("instructors")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 ${
            roleFilter === "instructors"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold"
              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Instructors ({instructorsCount})
        </button>
      </div>

      {/* Main List */}
      <div className="grid gap-5">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className="flex flex-col bg-slate-900/20 border border-slate-800/90 rounded-2xl p-4 sm:p-5 hover:border-slate-700/50 transition duration-200"
          >
            {/* User Meta Information */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/50 pb-4 mb-4">
              <div className="flex gap-4 items-center min-w-0">
                <Av name={user.name} size={42} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-200 truncate">
                      {user.name}
                    </p>
                    {user.roles?.map((r, i) => {
                      // Post-migration, user.roles is a MIXED array: base
                      // role strings ("student", "admin") alongside embedded
                      // custom-role objects ({ _id, name, permissions, ... }).
                      // Rendering `r` directly crashes React the moment a
                      // user has a custom role assigned — render the
                      // object's .name instead, and skip a bare string key.
                      if (r && typeof r === "object") {
                        return (
                          <span
                            key={r._id || `custom-${i}`}
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400"
                          >
                            {r.name}
                          </span>
                        );
                      }

                      let roleClass =
                        "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
                      if (r === "instructor") {
                        roleClass =
                          "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                      } else if (r === "admin") {
                        roleClass =
                          "bg-amber-500/10 border-amber-500/20 text-amber-400";
                      }
                      return (
                        <span
                          key={r}
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleClass}`}
                        >
                          {r}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Contact details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 w-full md:w-auto">
                {user.phoneNumber && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-indigo-400/80" />
                    {user.phoneNumber}
                  </span>
                )}
                {(user.city || user.state || user.pincode) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-emerald-400/80" />
                    <span>
                      {[user.city, user.state].filter(Boolean).join(", ")}
                      {user.pincode ? ` - ${user.pincode}` : ""}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Devices & Active Sessions */}
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2.5">
                Logged Devices & Sessions History ({user.devices?.length || 0})
              </p>

              {user.devices && user.devices.length > 0 ? (
                <div className="grid gap-2">
                  {user.devices.map((device, index) => {
                    const parsed = parseUA(device.userAgent);
                    const deviceId = `${user._id}-${index}`;
                    const isExpanded = !!expandedUserAgents[deviceId];

                    return (
                      <div
                        key={deviceId}
                        className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 sm:p-4 hover:border-slate-800 transition duration-150"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-indigo-400 shrink-0">
                              {parsed.isMobile ? (
                                <Smartphone size={16} />
                              ) : (
                                <Laptop size={16} />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-300">
                                {parsed.browser} on {parsed.os}
                              </p>
                              <button
                                onClick={() => toggleUA(deviceId)}
                                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold underline text-left block transition duration-100"
                              >
                                {isExpanded
                                  ? "Hide raw details"
                                  : "Show raw user-agent"}
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400 sm:justify-end shrink-0">
                            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/60 px-2 py-1 rounded-md shrink-0">
                              <Globe size={11} className="text-slate-500" />
                              <span className="font-mono text-[10px] text-slate-300">
                                {device.ip || "Unknown IP"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-400 font-medium shrink-0">
                              <Calendar size={11} className="text-slate-500" />
                              <span className="text-[10px]">
                                {device.lastLogin
                                  ? new Date(device.lastLogin).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible raw User Agent info */}
                        {isExpanded && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/40">
                            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Raw User-Agent String:
                            </p>
                            <p className="font-mono text-[9px] text-slate-400 bg-slate-950/40 border border-slate-900/60 rounded p-2 overflow-x-auto select-all leading-normal whitespace-pre-wrap">
                              {device.userAgent ||
                                "No user-agent details provided"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-slate-800/40 rounded-xl bg-slate-950/5">
                  <Shield size={20} className="text-slate-700 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500 font-medium">
                    No active logins or device records found for this account.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20">
            <Users size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400 font-medium">
              No matching accounts found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Refine your search input or role filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDevices;
