import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const NEWSPAPER = [
  {
    id: 1,
    category: "Education",
    tag: "CBSE",
    title: "CBSE Class 10 & 12 Board Exam Results 2025 Declared",
    excerpt:
      "Over 22 lakh students appeared this year. Pass percentage rises to 93.6% for Class 10 and 88.4% for Class 12 — highest in five years.",
    date: "June 4, 2025",
    readTime: "3 min",
    featured: true,
    color: "#818cf8",
  },
  {
    id: 2,
    category: "Competitive Exams",
    tag: "JEE",
    title: "JEE Advanced 2025 Registration Window Opens — Key Dates Inside",
    excerpt:
      "IIT Bombay releases the official schedule. Students who cleared JEE Mains cutoff can register starting June 10.",
    date: "June 3, 2025",
    readTime: "4 min",
    featured: false,
    color: "#22d3ee",
  },
  {
    id: 3,
    category: "Policy",
    tag: "NEP 2020",
    title:
      "NEP 2020 Implementation: States Report Progress on Mother-Tongue Medium",
    excerpt:
      "14 states have begun transitioning primary education to regional languages under the National Education Policy's five-language formula.",
    date: "June 2, 2025",
    readTime: "5 min",
    featured: false,
    color: "#34d399",
  },
  {
    id: 4,
    category: "Technology",
    tag: "EdTech",
    title:
      "AI Tutors in Classrooms: NCERT Partners with Three EdTech Platforms",
    excerpt:
      "Pilot programme launched in 200 schools across UP, MP, and Rajasthan. AI-powered tools aim to personalise learning at scale.",
    date: "May 30, 2025",
    readTime: "6 min",
    featured: false,
    color: "#f472b6",
  },
  {
    id: 5,
    category: "Competitive Exams",
    tag: "NEET",
    title:
      "NEET UG 2025 Paper Leak Allegations — NTA Issues Official Clarification",
    excerpt:
      "The National Testing Agency denies leak allegations and announces an independent review committee to audit exam processes.",
    date: "May 28, 2025",
    readTime: "4 min",
    featured: false,
    color: "#fbbf24",
  },
  {
    id: 6,
    category: "Scholarships",
    tag: "PM Scholarship",
    title: "PM Scholarship Scheme 2025 — Applications Open for 6,000 Seats",
    excerpt:
      "Ministry of Education invites applications from meritorious students of central armed police forces and railway families.",
    date: "May 25, 2025",
    readTime: "3 min",
    featured: false,
    color: "#a78bfa",
  },
];

const ROJGAR = [
  {
    id: 1,
    name: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY) 4.0",
    ministry: "Ministry of Skill Development",
    beneficiary: "Youth aged 15–45",
    benefit: "Free skill training + ₹8,000 reward on certification",
    deadline: "Rolling admissions",
    status: "active",
    link: "https://pmkvyofficial.org",
    tag: "Skill Training",
    color: "#34d399",
  },
  {
    id: 2,
    name: "National Apprenticeship Promotion Scheme (NAPS)",
    ministry: "Ministry of Education",
    beneficiary: "Students Class 5 pass & above",
    benefit: "Stipend of ₹1,500–₹10,000/month + OJT certificate",
    deadline: "Open year-round",
    status: "active",
    link: "https://apprenticeshipindia.gov.in",
    tag: "Apprenticeship",
    color: "#818cf8",
  },
  {
    id: 3,
    name: "PM SVANidhi — Street Vendor Atma Nirbhar Nidhi",
    ministry: "Ministry of Housing & Urban Affairs",
    beneficiary: "Street vendors",
    benefit: "Collateral-free loan ₹10K → ₹20K → ₹50K",
    deadline: "Open",
    status: "active",
    link: "https://pmsvanidhi.mohua.gov.in",
    tag: "Self Employment",
    color: "#fbbf24",
  },
  {
    id: 4,
    name: "Startup India Seed Fund Scheme",
    ministry: "DPIIT, Ministry of Commerce",
    beneficiary: "DPIIT-registered startups ≤ 2 years old",
    benefit: "Up to ₹20 lakh grant for PoC + ₹50 lakh for commercialisation",
    deadline: "Applications open",
    status: "active",
    link: "https://seedfund.startupindia.gov.in",
    tag: "Entrepreneurship",
    color: "#f472b6",
  },
  {
    id: 5,
    name: "Mukhya Mantri Seekho Kamao Yojana (MP)",
    ministry: "Madhya Pradesh Govt.",
    beneficiary: "MP youth aged 18–29, Class 12+",
    benefit: "₹8,000–₹10,000/month stipend during training",
    deadline: "Batch enrolment ongoing",
    status: "active",
    link: "https://mmsky.mp.gov.in",
    tag: "State Scheme",
    color: "#22d3ee",
  },
  {
    id: 6,
    name: "National Career Service (NCS) Portal",
    ministry: "Ministry of Labour & Employment",
    beneficiary: "All job seekers",
    benefit: "Free job matching, career counselling, skill courses",
    deadline: "Always open",
    status: "active",
    link: "https://www.ncs.gov.in",
    tag: "Job Portal",
    color: "#a78bfa",
  },
  {
    id: 7,
    name: "PM Vishwakarma Yojana",
    ministry: "Ministry of MSME",
    beneficiary: "18 traditional artisan categories",
    benefit:
      "₹15,000 toolkit grant + ₹3 lakh collateral-free loan at 5% interest",
    deadline: "Open",
    status: "active",
    link: "https://pmvishwakarma.gov.in",
    tag: "Artisan Support",
    color: "#34d399",
  },
  {
    id: 8,
    name: "e-Shram Portal Registration",
    ministry: "Ministry of Labour & Employment",
    beneficiary: "Unorganised sector workers",
    benefit: "₹2 lakh accident insurance + priority in govt schemes",
    deadline: "Permanent",
    status: "active",
    link: "https://eshram.gov.in",
    tag: "Worker Welfare",
    color: "#fbbf24",
  },
];

const NEWS_CATEGORIES = [
  "All",
  "Education",
  "Competitive Exams",
  "Policy",
  "Technology",
  "Scholarships",
];
const ROJGAR_TAGS = [
  "All",
  "Skill Training",
  "Apprenticeship",
  "Self Employment",
  "Entrepreneurship",
  "State Scheme",
  "Job Portal",
  "Artisan Support",
  "Worker Welfare",
];

// ── Sub-components ────────────────────────────────────────────────────────────

const CategoryPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 16px",
      borderRadius: 20,
      border: `1px solid ${active ? "#7c3aed" : "#1e293b"}`,
      background: active ? "#7c3aed" : "transparent",
      color: active ? "#fff" : "#64748b",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.15s",
    }}
  >
    {label}
  </button>
);

const NewsBadge = ({ label, color }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 20,
      background: `${color}18`,
      color,
      border: `1px solid ${color}30`,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    }}
  >
    {label}
  </span>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function Blogs() {
  const [activeTab, setActiveTab] = useState("news");
  const [newsCategory, setNewsCategory] = useState("All");
  const [rojgarTag, setRojgarTag] = useState("All");
  const [newsSearch, setNewsSearch] = useState("");
  const [rojgarSearch, setRojgarSearch] = useState("");

  const filteredNews = useMemo(
    () =>
      NEWSPAPER.filter((n) => {
        const matchCat = newsCategory === "All" || n.category === newsCategory;
        const matchSearch =
          n.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
          n.excerpt.toLowerCase().includes(newsSearch.toLowerCase());
        return matchCat && matchSearch;
      }),
    [newsCategory, newsSearch],
  );

  const filteredRojgar = useMemo(
    () =>
      ROJGAR.filter((r) => {
        const matchTag = rojgarTag === "All" || r.tag === rojgarTag;
        const matchSearch =
          r.name.toLowerCase().includes(rojgarSearch.toLowerCase()) ||
          r.benefit.toLowerCase().includes(rojgarSearch.toLowerCase());
        return matchTag && matchSearch;
      }),
    [rojgarTag, rojgarSearch],
  );

  const featured = filteredNews.find((n) => n.featured);
  const restNews = filteredNews.filter((n) => !n.featured);

  return (
    <div
      style={{
        background: "#0b1120",
        minHeight: "100vh",
        color: "#f1f5f9",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      {/* ── Page header ── */}
      <div
        style={{
          borderBottom: "1px solid #1e293b",
          background: "#0b1120",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "#818cf8",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Knowledge Hub
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
                News & Rojgar Yojana
              </h1>
            </div>

            {/* Tab toggle */}
            <div
              style={{
                display: "flex",
                background: "#1e293b",
                borderRadius: 12,
                padding: 4,
                gap: 4,
              }}
            >
              {[
                { key: "news", label: "📰 Newspaper" },
                { key: "rojgar", label: "💼 Rojgar Yojana" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    background:
                      activeTab === tab.key ? "#7c3aed" : "transparent",
                    color: activeTab === tab.key ? "#fff" : "#64748b",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* ══════════════ NEWSPAPER TAB ══════════════ */}
        {activeTab === "news" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Search + filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                value={newsSearch}
                onChange={(e) => setNewsSearch(e.target.value)}
                placeholder="Search news…"
                style={{
                  width: "100%",
                  maxWidth: 400,
                  padding: "10px 16px",
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 12,
                  color: "#f1f5f9",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {NEWS_CATEGORIES.map((cat) => (
                  <CategoryPill
                    key={cat}
                    label={cat}
                    active={newsCategory === cat}
                    onClick={() => setNewsCategory(cat)}
                  />
                ))}
              </div>
            </div>

            {filteredNews.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 0",
                  color: "#475569",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ fontWeight: 600, color: "#64748b" }}>
                  No articles found
                </p>
              </div>
            ) : (
              <>
                {/* Featured article */}
                {featured && newsSearch === "" && (
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 22,
                      overflow: "hidden",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                    }}
                  >
                    {/* Colour band */}
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${featured.color}22, ${featured.color}08)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 180,
                        padding: 32,
                      }}
                    >
                      <span style={{ fontSize: 72 }}>📰</span>
                    </div>
                    <div
                      style={{
                        padding: "28px 28px 28px 24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <NewsBadge label="Featured" color={featured.color} />
                        <NewsBadge
                          label={featured.tag}
                          color={featured.color}
                        />
                      </div>
                      <h2
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#f1f5f9",
                          lineHeight: 1.3,
                        }}
                      >
                        {featured.title}
                      </h2>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#94a3b8",
                          lineHeight: 1.7,
                        }}
                      >
                        {featured.excerpt}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          marginTop: 4,
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          🗓 {featured.date}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          ⏱ {featured.readTime} read
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Article grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 16,
                  }}
                >
                  {(newsSearch !== "" ? filteredNews : restNews).map(
                    (article) => (
                      <div
                        key={article.id}
                        style={{
                          background: "#111827",
                          border: "1px solid #1e293b",
                          borderRadius: 18,
                          padding: "22px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                          transition: "border-color 0.15s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor = "#334155")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = "#1e293b")
                        }
                      >
                        {/* Top accent line */}
                        <div
                          style={{
                            height: 3,
                            borderRadius: 2,
                            background: `linear-gradient(90deg, ${article.color}, ${article.color}44)`,
                            marginBottom: 4,
                          }}
                        />

                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          <NewsBadge
                            label={article.category}
                            color={article.color}
                          />
                          <NewsBadge
                            label={article.tag}
                            color={article.color}
                          />
                        </div>

                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#f1f5f9",
                            lineHeight: 1.4,
                            flex: 1,
                          }}
                        >
                          {article.title}
                        </h3>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#64748b",
                            lineHeight: 1.7,
                          }}
                        >
                          {article.excerpt}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "auto",
                            paddingTop: 8,
                            borderTop: "1px solid #1e293b",
                          }}
                        >
                          <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ fontSize: 11, color: "#475569" }}>
                              🗓 {article.date}
                            </span>
                            <span style={{ fontSize: 11, color: "#475569" }}>
                              ⏱ {article.readTime}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              color: article.color,
                              fontWeight: 600,
                            }}
                          >
                            Read →
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════ ROJGAR YOJANA TAB ══════════════ */}
        {activeTab === "rojgar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Search + filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                value={rojgarSearch}
                onChange={(e) => setRojgarSearch(e.target.value)}
                placeholder="Search schemes or benefits…"
                style={{
                  width: "100%",
                  maxWidth: 400,
                  padding: "10px 16px",
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 12,
                  color: "#f1f5f9",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ROJGAR_TAGS.map((tag) => (
                  <CategoryPill
                    key={tag}
                    label={tag}
                    active={rojgarTag === tag}
                    onClick={() => setRojgarTag(tag)}
                  />
                ))}
              </div>
            </div>

            {/* Summary strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  value: ROJGAR.length,
                  label: "Total Schemes",
                  color: "#818cf8",
                },
                {
                  value: ROJGAR.filter((r) => r.status === "active").length,
                  label: "Currently Active",
                  color: "#34d399",
                },
                {
                  value: new Set(ROJGAR.map((r) => r.tag)).size,
                  label: "Categories",
                  color: "#22d3ee",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: 14,
                    padding: "16px 18px",
                  }}
                >
                  <div
                    style={{ fontSize: 28, fontWeight: 800, color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {filteredRojgar.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 0",
                  color: "#475569",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ fontWeight: 600, color: "#64748b" }}>
                  No schemes found
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {filteredRojgar.map((scheme) => (
                  <div
                    key={scheme.id}
                    style={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: "22px 24px",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#334155")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#1e293b")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      {/* Left */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 240,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <NewsBadge label={scheme.tag} color={scheme.color} />
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: "#052e16",
                              color: "#4ade80",
                              border: "1px solid #16a34a30",
                            }}
                          >
                            ● Active
                          </span>
                        </div>

                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#f1f5f9",
                            lineHeight: 1.3,
                          }}
                        >
                          {scheme.name}
                        </h3>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {[
                            {
                              icon: "🏛️",
                              label: "Ministry",
                              value: scheme.ministry,
                            },
                            {
                              icon: "👤",
                              label: "Who can apply",
                              value: scheme.beneficiary,
                            },
                            {
                              icon: "💰",
                              label: "Benefit",
                              value: scheme.benefit,
                            },
                            {
                              icon: "📅",
                              label: "Deadline",
                              value: scheme.deadline,
                            },
                          ].map((row) => (
                            <div
                              key={row.label}
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: 13, flexShrink: 0 }}>
                                {row.icon}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#64748b",
                                  flexShrink: 0,
                                  minWidth: 90,
                                }}
                              >
                                {row.label}:
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#e2e8f0",
                                  fontWeight: 500,
                                }}
                              >
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Apply button */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          alignItems: "flex-end",
                        }}
                      >
                        <a
                          href={scheme.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "10px 20px",
                            borderRadius: 12,
                            border: "none",
                            background: `linear-gradient(135deg, ${scheme.color}, ${scheme.color}88)`,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "none",
                            display: "inline-block",
                            boxShadow: `0 4px 14px ${scheme.color}30`,
                          }}
                        >
                          Apply Now ↗
                        </a>
                        <span style={{ fontSize: 11, color: "#475569" }}>
                          Official portal
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div
              style={{
                background: "#1c1003",
                border: "1px solid #78350f30",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.7 }}>
                <strong style={{ color: "#fbbf24" }}>Disclaimer:</strong> Scheme
                details, deadlines, and eligibility are sourced from official
                government portals and are subject to change. Always verify on
                the official website before applying. SkillSphere is not
                affiliated with any government body.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
