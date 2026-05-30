import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Sidebar from "./Sidebar";

// ── DashboardHome (Overview page) ─────────────────────────────────────────────
export const DashboardHome = () => {
  const { user } = useApp();
  const username = user?.email ? user.email.split("@")[0] : "there";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Hero row */}
      <section
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <p style={{ color: "#818cf8", fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
            Welcome Back, {username} 👋
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1.2,
            }}
          >
            Student Dashboard
          </h1>
          <p
            style={{
              color: "#64748b",
              marginTop: 10,
              maxWidth: 500,
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            Track your learning progress, jump into your courses, and access
            AI-powered study tools — all from one place.
          </p>
        </div>
        <Link to="my-courses" style={{ color: "inherit", textDecoration: "none" }}>
        <button
          style={{
            background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "12px 24px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
            whiteSpace: "nowrap",
          }}
        >
            Continue Learning →
        </button>
          </Link>
      </section>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        {[
          { value: "12", label: "Enrolled Courses", color: "#818cf8" },
          { value: "85%", label: "Overall Progress", color: "#22d3ee" },
          { value: "#8", label: "Leaderboard Rank", color: "#f472b6" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: "22px 24px",
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 800, color: card.color }}>
              {card.value}
            </div>
            <div style={{ color: "#64748b", marginTop: 6, fontSize: 13 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Goal cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {[
          {
            tag: "NEXT GOAL",
            tagColor: "#818cf8",
            title: "Finish your AI course",
            desc: "Complete the machine learning module and unlock mentor feedback.",
          },
          {
            tag: "WEEKLY GOAL",
            tagColor: "#22d3ee",
            title: "Keep your streak alive",
            desc: "Attend at least one live session and review your latest quiz analytics.",
          },
          {
            tag: "COMMUNITY",
            tagColor: "#f472b6",
            title: "Join the next live event",
            desc: "Jump into mentorship, Q&A, and group study sessions from the dashboard.",
          },
        ].map((card) => (
          <div
            key={card.tag}
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: "22px 24px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: card.tagColor,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              {card.tag}
            </p>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: 10,
                lineHeight: 1.3,
              }}
            >
              {card.title}
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Dashboard layout ──────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9] md:flex">

      {/*
        ── Mobile backdrop ──────────────────────────────────────────────────────
        Renders as a semi-transparent full-screen overlay behind the sidebar
        whenever mobileOpen is true. Clicking it closes the sidebar.
        Hidden on md+ screens via "md:hidden".
      */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Right Side */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main
          className="flex-1 px-4 py-4 md:px-7 md:py-6"
          /*
            Clicking anywhere in the main content area while the mobile menu
            is open will also close it. The check prevents unnecessary state
            updates when the sidebar is already closed.
          */
          onClick={() => { if (mobileOpen) setMobileOpen(false); }}
        >
          {/*
            ── Mobile top bar ─────────────────────────────────────────────────
            The "Menu" button is the ONLY way to open the sidebar on mobile.
            The collapse/expand toggle that lives inside Sidebar is hidden on
            mobile (handle that in Sidebar.jsx — see note below).
          */}
          <div className="flex items-center justify-between gap-4 pb-4 md:hidden">
            <button
              onClick={(e) => {
                // Stop propagation so the main onClick above doesn't
                // immediately close the sidebar we just opened.
                e.stopPropagation();
                setMobileOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20"
            >
              Menu
            </button>
            <h2 className="text-lg font-semibold text-white">Student Dashboard</h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-white/5 p-5 md:p-7 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;