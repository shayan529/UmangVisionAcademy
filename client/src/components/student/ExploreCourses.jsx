import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ALL_COURSES = [
  {
    id: 1,
    title: 'Full Stack Web Development',
    instructor: 'Sarah Chen',
    category: 'Programming',
    level: 'Intermediate',
    rating: 4.9,
    students: 12400,
    price: 1999,
    thumb: '💻',
    enrolled: false,
  },
  {
    id: 2,
    title: 'AI & Machine Learning',
    instructor: 'Alex Kumar',
    category: 'AI',
    level: 'Advanced',
    rating: 4.8,
    students: 8300,
    price: 2499,
    thumb: '🤖',
    enrolled: true,
  },
  {
    id: 3,
    title: 'UI/UX Design Masterclass',
    instructor: 'Rae Johnson',
    category: 'Design',
    level: 'Beginner',
    rating: 4.9,
    students: 9200,
    price: 1599,
    thumb: '🎨',
    enrolled: false,
  },
  {
    id: 4,
    title: 'Digital Marketing Mastery',
    instructor: 'Mark Davis',
    category: 'Marketing',
    level: 'Beginner',
    rating: 4.6,
    students: 7100,
    price: 1299,
    thumb: '📣',
    enrolled: false,
  },
  {
    id: 5,
    title: 'Data Science with Python',
    instructor: 'Lisa Wang',
    category: 'AI',
    level: 'Intermediate',
    rating: 4.8,
    students: 11000,
    price: 2999,
    thumb: '📊',
    enrolled: true,
  },
  {
    id: 6,
    title: 'Node.js Advanced Patterns',
    instructor: 'Sarah Chen',
    category: 'Programming',
    level: 'Advanced',
    rating: 4.7,
    students: 4200,
    price: 1799,
    thumb: '⚡',
    enrolled: false,
  },
  {
    id: 7,
    title: 'React + Next.js Masterclass',
    instructor: 'Alex Kumar',
    category: 'Programming',
    level: 'Intermediate',
    rating: 4.8,
    students: 6800,
    price: 2199,
    thumb: '⚛️',
    enrolled: false,
  },
  {
    id: 8,
    title: 'Business Strategy & Leadership',
    instructor: 'Priya Sharma',
    category: 'Business',
    level: 'Intermediate',
    rating: 4.7,
    students: 5600,
    price: 1799,
    thumb: '💼',
    enrolled: false,
  },
];

const CATEGORIES = [
  'All',
  'Programming',
  'AI',
  'Design',
  'Marketing',
  'Business',
];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const tagColor = {
  Programming: '#EEEDFE',
  AI: '#E1F5EE',
  Design: '#FBEAF0',
  Marketing: '#FFF0F0',
  Business: '#FAEEDA',
};
const tagText = {
  Programming: '#534AB7',
  AI: '#0F6E56',
  Design: '#993556',
  Marketing: '#C0392B',
  Business: '#854F0B',
};

export default function ExploreCourses() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [enrolled, setEnrolled] = useState(
    ALL_COURSES.reduce((acc, c) => ({ ...acc, [c.id]: c.enrolled }), {})
  );

  const filtered = ALL_COURSES.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || c.category === category;
    const matchLevel = level === 'All' || c.level === level;
    return matchSearch && matchCategory && matchLevel;
  });

  const toggleEnroll = (id) =>
    setEnrolled((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9' }}>
          {t('exploreCourses.title')}
        </h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          {t('exploreCourses.subtitle', { count: ALL_COURSES.length })}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth={2}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          placeholder={t('exploreCourses.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px 11px 40px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 12,
            color: '#f1f5f9',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {/* Filters */}
      <div
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#1e293b',
            padding: 4,
            borderRadius: 10,
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: category === cat ? '#7c3aed' : 'transparent',
                color: category === cat ? '#fff' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#1e293b',
            padding: 4,
            borderRadius: 10,
          }}
        >
          {LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              style={{
                padding: '5px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: level === lv ? '#0f172a' : 'transparent',
                color: level === lv ? '#a78bfa' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {lv}
            </button>
          ))}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: '#64748b',
            alignSelf: 'center',
          }}
        >
          {filtered.length} results
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>{t('exploreCourses.noResults')}</p>
        ) : (
          filtered.map((course) => (
            <div
              key={course.id}
              style={{
                background: '#111827',
                border: '1px solid #1e293b',
                borderRadius: 16,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Thumb */}
              <div
                style={{
                  height: 110,
                  background: tagColor[course.category] || '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 44,
                }}
              >
                {course.thumb}
              </div>
              <div style={{ padding: '14px 16px' }}>
                {/* Tag + level */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: tagColor[course.category],
                      color: tagText[course.category],
                    }}
                  >
                    {course.category}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: '#1e293b',
                      color: '#94a3b8',
                      border: '1px solid #334155',
                    }}
                  >
                    {course.level}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    marginBottom: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {course.title}
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                  {course.instructor}
                </p>
                {/* Rating + students */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#f1f5f9',
                      }}
                    >
                      {course.rating}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      ({course.students.toLocaleString()})
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 15, fontWeight: 800, color: '#a78bfa' }}
                  >
                    ₹{course.price.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => toggleEnroll(course.id)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: enrolled[course.id]
                      ? '#052e16'
                      : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                    color: enrolled[course.id] ? '#4ade80' : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  {enrolled[course.id]
                    ? t('exploreCourses.enrolled')
                    : t('exploreCourses.enrollNow')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length === 0 && (
        <div
          style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p>{t('exploreCourses.noResults')}</p>
        </div>
      )}
    </div>
  );
}
