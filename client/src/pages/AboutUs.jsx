import React from 'react';
import { useTranslation } from 'react-i18next';

const team = [
  {
    initials: 'RK',
    nameKey: 'aboutUs.team.RK.name',
    roleKey: 'aboutUs.team.RK.role',
    bioKey: 'aboutUs.team.RK.bio',
    color: '#1D9E75',
    bg: '#E1F5EE',
  },
  {
    initials: 'PS',
    nameKey: 'aboutUs.team.PS.name',
    roleKey: 'aboutUs.team.PS.role',
    bioKey: 'aboutUs.team.PS.bio',
    color: '#185FA5',
    bg: '#E6F1FB',
  },
  {
    initials: 'AV',
    nameKey: 'aboutUs.team.AV.name',
    roleKey: 'aboutUs.team.AV.role',
    bioKey: 'aboutUs.team.AV.bio',
    color: '#534AB7',
    bg: '#EEEDFE',
  },
  {
    initials: 'NK',
    nameKey: 'aboutUs.team.NK.name',
    roleKey: 'aboutUs.team.NK.role',
    bioKey: 'aboutUs.team.NK.bio',
    color: '#993556',
    bg: '#FBEAF0',
  },
];

const values = [
  {
    icon: 'ti-bulb',
    titleKey: 'aboutUs.values.curiosity.title',
    descKey: 'aboutUs.values.curiosity.desc',
    color: '#BA7517',
    bg: '#FAEEDA',
  },
  {
    icon: 'ti-shield-check',
    titleKey: 'aboutUs.values.trust.title',
    descKey: 'aboutUs.values.trust.desc',
    color: '#185FA5',
    bg: '#E6F1FB',
  },
  {
    icon: 'ti-users',
    titleKey: 'aboutUs.values.access.title',
    descKey: 'aboutUs.values.access.desc',
    color: '#1D9E75',
    bg: '#E1F5EE',
  },
  {
    icon: 'ti-chart-line',
    titleKey: 'aboutUs.values.outcomes.title',
    descKey: 'aboutUs.values.outcomes.desc',
    color: '#534AB7',
    bg: '#EEEDFE',
  },
];

const stats = [
  { value: '50K+', labelKey: 'aboutUs.stats.activeStudents' },
  { value: '200+', labelKey: 'aboutUs.stats.coursesPublished' },
  { value: '98%', labelKey: 'aboutUs.stats.passRate' },
  { value: '32', labelKey: 'aboutUs.stats.statesCovered' },
];

export default function AboutUs() {
  const { t } = useTranslation();

  const translatedStats = stats.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }));

  const missionItems = [
    {
      labelKey: 'aboutUs.mission.founded.label',
      valueKey: 'aboutUs.mission.founded.value',
    },
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

  return (
    <div
      style={{
        background: '#0B1120',
        color: '#f1f5f9',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        minHeight: '100vh',
      }}
    >
      {/* ── Hero ── */}
      <section
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '96px 24px 72px',
          textAlign: 'center',
        }}
      >
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
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            color: '#f1f5f9',
            marginBottom: 24,
          }}
        >
          {t('aboutUs.hero.headingPrefix')}
          <br />
          <span style={{ color: '#a78bfa' }}>
            {t('aboutUs.hero.highlight')}
          </span>
        </h1>
        <p
          style={{
            fontSize: 18,
            color: '#94a3b8',
            lineHeight: 1.8,
            maxWidth: 620,
            margin: '0 auto',
          }}
        >
          {t('aboutUs.hero.description')}
        </p>
      </section>

      {/* ── Stats ── */}
      <section
        style={{
          background: '#111827',
          borderTop: '1px solid #1e293b',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '48px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 0,
          }}
        >
          {translatedStats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderRight:
                  i < translatedStats.length - 1 ? '1px solid #1e293b' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: '#a78bfa',
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
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
        style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
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
              style={{
                fontSize: 'clamp(26px, 4vw, 38px)',
                fontWeight: 800,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {missionItems.map((item) => (
              <div
                key={item.labelKey}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: '#111827',
                  borderRadius: 12,
                  border: '1px solid #1e293b',
                }}
              >
                <span
                  style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}
                >
                  {t(item.labelKey)}
                </span>
                <span
                  style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}
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
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
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
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 800,
                color: '#f1f5f9',
              }}
            >
              {t('aboutUs.values.heading')}
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20,
            }}
          >
            {translatedValues.map((v, i) => (
              <div
                key={i}
                style={{
                  background: '#0b1120',
                  border: '1px solid #1e293b',
                  borderRadius: 18,
                  padding: '24px 22px',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: v.bg + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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

      {/* ── Team ── */}
      <section
        style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#34d399',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {t('aboutUs.team.tag')}
          </p>
          <h2
            style={{
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 800,
              color: '#f1f5f9',
            }}
          >
            {t('aboutUs.team.heading')}
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
          }}
        >
          {translatedTeam.map((member, i) => (
            <div
              key={i}
              style={{
                background: '#111827',
                border: '1px solid #1e293b',
                borderRadius: 20,
                padding: '28px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: member.bg + '22',
                  border: `2px solid ${member.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                    color: '#f1f5f9',
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
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {member.role}
                </p>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
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
            'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #0c1a2e 100%)',
          borderTop: '1px solid #1e293b',
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
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 800,
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
              style={{
                padding: '14px 32px',
                borderRadius: 14,
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
              }}
            >
              {t('aboutUs.cta.getStarted')}
            </a>
            <a
              href="/courses"
              style={{
                padding: '14px 32px',
                borderRadius: 14,
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
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
