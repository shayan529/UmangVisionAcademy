import React from "react";

const team = [
  {
    initials: "RK",
    name: "Rajesh Kumar",
    role: "Founder & CEO",
    bio: "IIT Delhi alumnus with 15 years in EdTech. Built learning platforms that helped 1M+ students crack competitive exams.",
    color: "#1D9E75",
    bg: "#E1F5EE",
  },
  {
    initials: "PS",
    name: "Priya Sharma",
    role: "Head of Curriculum",
    bio: "Former CBSE examiner and educator with expertise in designing outcome-driven learning paths for Classes 6–12.",
    color: "#185FA5",
    bg: "#E6F1FB",
  },
  {
    initials: "AV",
    name: "Arjun Verma",
    role: "CTO",
    bio: "Ex-Google engineer passionate about accessible technology. Leads the AI tutor and adaptive learning engine.",
    color: "#534AB7",
    bg: "#EEEDFE",
  },
  {
    initials: "NK",
    name: "Neha Kapoor",
    role: "Head of Student Success",
    bio: "Dedicated to closing the learning gap. Has personally mentored 500+ students from Tier-2 and Tier-3 cities.",
    color: "#993556",
    bg: "#FBEAF0",
  },
];

const values = [
  {
    icon: "ti-bulb",
    title: "Curiosity first",
    desc: "We build for the student who asks why — not just what. Every feature starts with a learner's question.",
    color: "#BA7517",
    bg: "#FAEEDA",
  },
  {
    icon: "ti-shield-check",
    title: "Trust through transparency",
    desc: "No dark patterns. No hidden fees. Students and parents always know what they're paying for and why.",
    color: "#185FA5",
    bg: "#E6F1FB",
  },
  {
    icon: "ti-users",
    title: "Access for everyone",
    desc: "Quality education shouldn't depend on your pin code. We offer scholarships and low-bandwidth support.",
    color: "#1D9E75",
    bg: "#E1F5EE",
  },
  {
    icon: "ti-chart-line",
    title: "Outcomes over vanity",
    desc: "We measure success by student results — not app opens. If a feature doesn't improve scores, it ships last.",
    color: "#534AB7",
    bg: "#EEEDFE",
  },
];

const stats = [
  { value: "50K+", label: "Active students" },
  { value: "200+", label: "Courses published" },
  { value: "98%", label: "Pass rate" },
  { value: "32", label: "States covered" },
];

export default function AboutUs() {
  return (
    <div
      style={{
        background: "#0B1120",
        color: "#f1f5f9",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "96px 24px 72px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#818cf8",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Our Story
        </p>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#f1f5f9",
            marginBottom: 24,
          }}
        >
          Built by educators,
          <br />
          <span style={{ color: "#a78bfa" }}>for every learner.</span>
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#94a3b8",
            lineHeight: 1.8,
            maxWidth: 620,
            margin: "0 auto",
          }}
        >
          SkillSphere started in a small room in Jabalpur with one goal: give
          every Indian student — regardless of their city, school, or income —
          access to world-class education. That mission hasn't changed.
        </p>
      </section>

      {/* ── Stats ── */}
      <section
        style={{
          background: "#111827",
          borderTop: "1px solid #1e293b",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "48px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 0,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "24px 16px",
                borderRight:
                  i < stats.length - 1 ? "1px solid #1e293b" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: "#a78bfa",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginTop: 8,
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ── */}
      <section
        style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 32,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#22d3ee",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Our Mission
            </p>
            <h2
              style={{
                fontSize: "clamp(26px, 4vw, 38px)",
                fontWeight: 800,
                color: "#f1f5f9",
                lineHeight: 1.2,
                marginBottom: 20,
              }}
            >
              Democratise quality education across India
            </h2>
            <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.8 }}>
              Over 260 million students study in Indian schools. Less than 5%
              have access to quality coaching. We're using AI, live classes, and
              personalised learning paths to close that gap — one student at a
              time.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Founded", value: "2021 · Jabalpur, MP" },
              {
                label: "Supported classes",
                value: "Class 1 – 12 (CBSE & State)",
              },
              { label: "Languages", value: "English & Hindi" },
              {
                label: "Learning model",
                value: "Hybrid — live + recorded + AI",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  background: "#111827",
                  borderRadius: 12,
                  border: "1px solid #1e293b",
                }}
              >
                <span
                  style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}
                >
                  {item.label}
                </span>
                <span
                  style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section
        style={{
          background: "#111827",
          borderTop: "1px solid #1e293b",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#f472b6",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              What we stand for
            </p>
            <h2
              style={{
                fontSize: "clamp(26px, 4vw, 36px)",
                fontWeight: 800,
                color: "#f1f5f9",
              }}
            >
              Our values
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {values.map((v, i) => (
              <div
                key={i}
                style={{
                  background: "#0b1120",
                  border: "1px solid #1e293b",
                  borderRadius: 18,
                  padding: "24px 22px",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: v.bg + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    border: `1px solid ${v.color}30`,
                  }}
                >
                  <i
                    className={`ti ${v.icon}`}
                    style={{ fontSize: 22, color: v.color }}
                    aria-hidden="true"
                  />
                </div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    marginBottom: 10,
                  }}
                >
                  {v.title}
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section
        style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#34d399",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            The people
          </p>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 800,
              color: "#f1f5f9",
            }}
          >
            Meet the team
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
        >
          {team.map((member, i) => (
            <div
              key={i}
              style={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 20,
                padding: "28px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: member.bg + "22",
                  border: `2px solid ${member.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: member.color,
                  flexShrink: 0,
                }}
              >
                {member.initials}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    marginBottom: 4,
                  }}
                >
                  {member.name}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: member.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {member.role}
                </p>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #0c1a2e 100%)",
          borderTop: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "96px 24px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            Ready to start learning?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#94a3b8",
              lineHeight: 1.8,
              marginBottom: 40,
            }}
          >
            Join 50,000+ students who are already learning smarter with
            SkillSphere.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/signup"
              style={{
                padding: "14px 32px",
                borderRadius: 14,
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
              }}
            >
              Get started free
            </a>
            <a
              href="/courses"
              style={{
                padding: "14px 32px",
                borderRadius: 14,
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Browse courses
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
