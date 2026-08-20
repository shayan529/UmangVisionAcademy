import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import SEO from '../components/common/SEO';

const team = [
  {
    initials: 'RK',
    nameKey: 'aboutUs.team.RK.name',
    roleKey: 'aboutUs.team.RK.role',
    bioKey: 'aboutUs.team.RK.bio',
    color: '#1D9E75',
    code: 'FAC / 01',
  },
  {
    initials: 'PS',
    nameKey: 'aboutUs.team.PS.name',
    roleKey: 'aboutUs.team.PS.role',
    bioKey: 'aboutUs.team.PS.bio',
    color: '#185FA5',
    code: 'FAC / 02',
  },
  {
    initials: 'AV',
    nameKey: 'aboutUs.team.AV.name',
    roleKey: 'aboutUs.team.AV.role',
    bioKey: 'aboutUs.team.AV.bio',
    color: '#534AB7',
    code: 'FAC / 03',
  },
  {
    initials: 'NK',
    nameKey: 'aboutUs.team.NK.name',
    roleKey: 'aboutUs.team.NK.role',
    bioKey: 'aboutUs.team.NK.bio',
    color: '#993556',
    code: 'FAC / 04',
  },
];

const values = [
  {
    icon: Lightbulb,
    titleKey: 'aboutUs.values.curiosity.title',
    descKey: 'aboutUs.values.curiosity.desc',
    color: '#F2A93B',
  },
  {
    icon: ShieldCheck,
    titleKey: 'aboutUs.values.trust.title',
    descKey: 'aboutUs.values.trust.desc',
    color: '#185FA5',
  },
  {
    icon: Users,
    titleKey: 'aboutUs.values.access.title',
    descKey: 'aboutUs.values.access.desc',
    color: '#1D9E75',
  },
  {
    icon: TrendingUp,
    titleKey: 'aboutUs.values.outcomes.title',
    descKey: 'aboutUs.values.outcomes.desc',
    color: '#534AB7',
  },
];

const stats = [
  {
    value: '200+',
    labelKey: 'aboutUs.stats.coursesPublished',
    fallback: 'Courses Published',
  },
  {
    value: '7',
    labelKey: 'aboutUs.stats.languages',
    fallback: 'Languages',
    tooltip: 'English, Hindi, Marathi, Gujarati, Bengali, Tamil & Telugu',
  },
  {
    value: '3',
    labelKey: 'aboutUs.stats.boardsSupported',
    fallback: 'Boards Supported',
    tooltip: 'CBSE · ICSE · MP Board',
  },
  {
    value: '9–12',
    labelKey: 'aboutUs.stats.classesCovered',
    fallback: 'Classes Covered',
    tooltip: 'Class 9, 10, 11 & 12',
  },
];

export default function AboutUs() {
  const { t } = useTranslation();

  const translatedStats = stats.map((item, i) => ({
    ...item,
    label: t(item.labelKey, item.fallback),
    serial: String(i + 1).padStart(2, '0'),
  }));

  const missionItems = [
    {
      labelKey: 'aboutUs.mission.supportedClasses.label',
      valueKey: 'aboutUs.mission.supportedClasses.value',
    },
    {
      labelKey: 'aboutUs.mission.languages.label',
      valueKey: 'aboutUs.mission.languages.value',
    },
    {
      labelKey: 'aboutUs.mission.learningModel.label',
      valueKey: 'aboutUs.mission.learningModel.value',
    },
  ];

  const translatedValues = values.map((item) => ({
    ...item,
    title: t(item.titleKey),
    desc: t(item.descKey),
  }));

  const translatedTeam = team.map((member) => ({
    ...member,
    name: t(member.nameKey),
    role: t(member.roleKey),
    bio: t(member.bioKey),
  }));

  // Decorative admit-card fields — not core content, just letterhead flavor
  const admitCardFields = [
    {
      label: t('aboutUs.admitCard.candidate', 'CANDIDATE'),
      value: t('aboutUs.admitCard.candidateValue', 'Every Learner'),
    },
    {
      label: t('aboutUs.admitCard.classField', 'CLASS'),
      value: t(
        'aboutUs.admitCard.classValue',
        missionItems[1] ? t(missionItems[1].valueKey) : '9 – 12'
      ),
    },
    {
      label: t('aboutUs.admitCard.board', 'BOARD'),
      value: t('aboutUs.admitCard.boardValue', 'CBSE · ICSE · MP Board'),
    },
    {
      label: t('aboutUs.admitCard.validity', 'VALIDITY'),
      value: t('aboutUs.admitCard.validityValue', 'Lifetime Access'),
    },
  ];

  return (
    <div
      style={{
        background: '#0B1120',
        color: '#f1f5f9',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <SEO
        title="About Us"
        description="Learn more about Umang Vision Academy and our team of expert instructors."
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

        .uva-display { font-family: 'Fraunces', Georgia, serif; }
        .uva-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; }

        @keyframes uvaRise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes uvaStampIn {
          from { opacity: 0; transform: rotate(-18deg) scale(0.7); }
          to   { opacity: 1; transform: rotate(-9deg) scale(1); }
        }

        .uva-rise { animation: uvaRise 0.7s cubic-bezier(.2,.8,.2,1) both; }
        .uva-stamp { animation: uvaStampIn 0.8s cubic-bezier(.34,1.4,.64,1) 0.5s both; }

        .uva-notebook-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 35px,
            rgba(148,163,184,0.045) 35px,
            rgba(148,163,184,0.045) 36px
          );
          z-index: 0;
        }

        .uva-punch {
          height: 18px;
          background-image: radial-gradient(circle 5.5px at 10px 0, #0B1120 5.5px, transparent 6px);
          background-size: 22px 18px;
          background-repeat: repeat-x;
          background-position: left top;
        }

        .uva-leader {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .uva-leader-fill {
          flex: 1;
          border-bottom: 2px dotted #2a3a52;
          transform: translateY(-5px);
          min-width: 20px;
        }

        .uva-value-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .uva-value-card:hover {
          transform: translateY(-3px);
          border-color: #334155;
        }

        .uva-team-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .uva-team-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }

        .uva-cta-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .uva-cta-btn:hover { transform: translateY(-2px); }

        @media (max-width: 720px) {
          .uva-admit-card { transform: none !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .uva-rise, .uva-stamp { animation: none !important; opacity: 1 !important; transform: none !important; }
          .uva-value-card, .uva-team-card, .uva-cta-btn { transition: none !important; }
        }
      `}</style>

      <div className="uva-notebook-bg" />

      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '88px 24px 64px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          {/* Left: real hero content */}
          <div className="uva-rise">
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#818cf8',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              {t('aboutUs.hero.tag')}
            </p>
            <h1
              className="uva-display"
              style={{
                fontSize: 'clamp(38px, 5.5vw, 62px)',
                fontWeight: 700,
                lineHeight: 1.08,
                color: '#f1f5f9',
                marginBottom: 24,
              }}
            >
              {t('aboutUs.hero.headingPrefix')}
              <br />
              <span style={{ color: '#F2A93B' }}>
                {t('aboutUs.hero.highlight')}
              </span>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: '#94a3b8',
                lineHeight: 1.8,
                maxWidth: 480,
              }}
            >
              {t('aboutUs.hero.description')}
            </p>
          </div>

          {/* Right: signature element — the admit card */}
          <div
            className="uva-admit-card uva-rise"
            style={{
              transform: 'rotate(2deg)',
              animationDelay: '0.15s',
            }}
          >
            <div
              style={{
                background: '#111827',
                border: '1px solid #263248',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                maxWidth: 420,
                margin: '0 auto',
                position: 'relative',
              }}
            >
              {/* Letterhead strip */}
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px dashed #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p
                    className="uva-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      color: '#64748b',
                      marginBottom: 4,
                    }}
                  >
                    {t('aboutUs.admitCard.eyebrow', 'HALL TICKET')}
                  </p>
                  <p
                    className="uva-display"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#f1f5f9',
                    }}
                  >
                    {t('aboutUs.admitCard.title', 'Umang Vision Academy')}
                  </p>
                </div>
                <div
                  className="uva-stamp"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    border: '2px dashed #C1443C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transform: 'rotate(-9deg)',
                  }}
                >
                  <span
                    className="uva-mono"
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#C1443C',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {t('aboutUs.admitCard.stamp', 'VERIFIED')}
                  </span>
                </div>
              </div>

              {/* Field rows */}
              <div
                style={{
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {admitCardFields.map((f) => (
                  <div
                    key={f.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 12,
                    }}
                  >
                    <span
                      className="uva-mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        color: '#64748b',
                        flexShrink: 0,
                      }}
                    >
                      {f.label}
                    </span>
                    <span
                      className="uva-mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#e2e8f0',
                        textAlign: 'right',
                      }}
                    >
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Perforated tear line */}
              <div className="uva-punch" />
              <div
                style={{
                  padding: '12px 22px 16px',
                  textAlign: 'center',
                }}
              >
                <span
                  className="uva-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    color: '#475569',
                  }}
                >
                  {t('aboutUs.admitCard.footer', 'NO EXAM · JUST ENROLL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats — marksheet ── */}
      <section
        style={{
          background: '#111827',
          borderTop: '1px solid #1e293b',
          borderBottom: '1px solid #1e293b',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            padding: '48px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <span
              className="uva-mono"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.14em',
                color: '#64748b',
              }}
            >
              {t('aboutUs.stats.tag', 'PROGRESS REPORT')}
            </span>
            <span
              className="uva-mono"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#1D9E75',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✓ {t('aboutUs.stats.verified', 'VERIFIED')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {translatedStats.map((s, i) => (
              <div
                key={i}
                className="uva-leader"
                style={{
                  padding: '16px 0',
                  borderBottom:
                    i < translatedStats.length - 1
                      ? '1px solid #1e293b'
                      : 'none',
                }}
              >
                <span
                  className="uva-mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#475569',
                    flexShrink: 0,
                  }}
                >
                  {s.serial}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: '#94a3b8',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </span>
                <span className="uva-leader-fill" />
                <span
                  className="uva-display"
                  title={s.tooltip || undefined}
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: '#F2A93B',
                    flexShrink: 0,
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '88px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#22d3ee',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              {t('aboutUs.mission.tag')}
            </p>
            <h2
              className="uva-display"
              style={{
                fontSize: 'clamp(26px, 4vw, 38px)',
                fontWeight: 700,
                color: '#f1f5f9',
                lineHeight: 1.2,
                marginBottom: 20,
              }}
            >
              {t('aboutUs.mission.heading')}
            </h2>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8 }}>
              {t('aboutUs.mission.description')}
            </p>
          </div>
          <div
            style={{
              background: '#111827',
              border: '1px solid #1e293b',
              borderRadius: 16,
              padding: '12px 22px',
            }}
          >
            {missionItems.map((item, i) => (
              <div
                key={item.labelKey}
                style={{
                  padding: '14px 0',
                  borderBottom:
                    i < missionItems.length - 1 ? '1px solid #1e293b' : 'none',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {t(item.labelKey)}
                </span>
                <span
                  className="uva-leader-fill"
                  style={{
                    flex: 1,
                    minWidth: 10,
                    marginBottom: 4,
                  }}
                />
                <span
                  className="uva-mono"
                  style={{
                    fontSize: 12.5,
                    color: '#e2e8f0',
                    fontWeight: 600,
                    textAlign: 'right',
                    maxWidth: '65%',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {t(item.valueKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section
        style={{
          background: '#111827',
          borderTop: '1px solid #1e293b',
          borderBottom: '1px solid #1e293b',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '88px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#f472b6',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {t('aboutUs.values.tag')}
            </p>
            <h2
              className="uva-display"
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 700,
                color: '#f1f5f9',
              }}
            >
              {t('aboutUs.values.heading')}
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 20,
            }}
          >
            {translatedValues.map((v, i) => (
              <div
                key={i}
                className="uva-value-card"
                style={{
                  background: '#0b1120',
                  border: '1px solid #1e293b',
                  borderTop: `3px solid ${v.color}`,
                  borderRadius: '4px 4px 14px 14px',
                  padding: '24px 22px',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${v.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    border: `1px solid ${v.color}35`,
                  }}
                >
                  <v.icon size={20} color={v.color} strokeWidth={2.2} />
                </div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    marginBottom: 10,
                  }}
                >
                  {v.title}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team — faculty ID cards ── */}

      {/* ── CTA ── */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #0c1a2e 100%)',
          borderTop: '1px solid #1e293b',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '96px 24px',
            textAlign: 'center',
          }}
        >
          <p
            className="uva-mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.16em',
              color: '#F2A93B',
              marginBottom: 16,
            }}
          >
            {t('aboutUs.cta.tag', 'ADMISSIONS OPEN')}
          </p>
          <h2
            className="uva-display"
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 700,
              color: '#f1f5f9',
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {t('aboutUs.cta.title')}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: '#94a3b8',
              lineHeight: 1.8,
              marginBottom: 40,
            }}
          >
            {t('aboutUs.cta.body')}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/signup"
              className="uva-cta-btn"
              style={{
                padding: '14px 32px',
                borderRadius: 14,
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                display: 'inline-block',
              }}
            >
              {t('aboutUs.cta.getStarted')}
            </a>
            <a
              href="/courses"
              className="uva-cta-btn"
              style={{
                padding: '14px 32px',
                borderRadius: 14,
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {t('aboutUs.cta.browseCourses')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
