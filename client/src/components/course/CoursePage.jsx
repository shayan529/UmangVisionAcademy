import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../config/api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (secs) => {
  if (!secs) return '';
  const m = Math.floor(secs / 60),
    s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
const fmtMins = (mins) => {
  if (!mins) return '';
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const groupIntoChapters = (lessons = []) => {
  const chapters = [];
  let current = null;
  lessons.forEach((lesson, idx) => {
    if (
      lesson.chapterTitle &&
      (!current || current.title !== lesson.chapterTitle)
    ) {
      current = { title: lesson.chapterTitle, lessons: [] };
      chapters.push(current);
    }
    if (!current) {
      current = { title: 'Chapter 1', lessons: [] };
      chapters.push(current);
    }
    current.lessons.push({ ...lesson, globalIdx: idx });
  });
  return chapters;
};

// ── Video Player ──────────────────────────────────────────────────────────────
// Props: url, poster, initialTime (frozen snapshot — does NOT change during playback),
//        onEnded, onProgress (throttled by parent)
const VideoPlayer = ({ url, poster, onEnded, onProgress, initialTime = 0 }) => {
  const ref = useRef(null);
  const playingRef = useRef(false);
  const hideTimer = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Reset state when url changes (lesson switch)
  useEffect(() => {
    setPlaying(false);
    playingRef.current = false;
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    setShowControls(true);
  }, [url]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) setShowControls(false);
    }, 3000);
  }, []);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (playingRef.current) {
      v.pause();
    } else {
      v.play().catch((err) => console.warn('play() failed:', err));
    }
  }, []);

  const handleWrapperClick = useCallback(
    (e) => {
      // Only toggle if clicking the video itself, not controls
      toggle();
    },
    [toggle]
  );

  const onTimeUpdate = useCallback(() => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setProgress(pct);
    setCurrent(v.currentTime);
    onProgress?.(pct, v.currentTime);
  }, [onProgress]);

  const seek = useCallback((e) => {
    const v = ref.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      ref.current?.parentElement?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  const cycleSpeed = useCallback(() => {
    const next = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    if (ref.current) ref.current.playbackRate = next;
    setPlaybackRate(next);
  }, [playbackRate]);

  if (!url)
    return (
      <div
        style={{
          aspectRatio: '16/9',
          background: '#0f172a',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 48 }}>🎬</span>
        <p style={{ color: '#475569', fontSize: 14 }}>
          No video for this lesson
        </p>
      </div>
    );

  return (
    <div
      onMouseMove={resetHide}
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        background: '#000',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Actual video — no onClick here to avoid double-fire */}
      <video
        ref={ref}
        src={url}
        poster={poster}
        playsInline
        muted={muted}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => {
          const v = ref.current;
          if (!v) return;
          setDuration(v.duration);
          // Restore saved position only once on load
          if (initialTime > 0 && initialTime < v.duration - 1) {
            v.currentTime = initialTime;
          }
        }}
        onPlay={() => {
          playingRef.current = true;
          setPlaying(true);
          resetHide();
        }}
        onPause={() => {
          playingRef.current = false;
          setPlaying(false);
          setShowControls(true);
          clearTimeout(hideTimer.current);
        }}
        onEnded={() => {
          playingRef.current = false;
          setPlaying(false);
          setShowControls(true);
          onEnded?.();
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {/* Click zone — only when NOT playing (shows overlay) */}
      {!playing && (
        <div
          onClick={handleWrapperClick}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(124,58,237,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 50px rgba(124,58,237,0.6)',
            }}
          >
            <span style={{ fontSize: 26, marginLeft: 5, color: '#fff' }}>
              ▶
            </span>
          </div>
        </div>
      )}

      {/* Pause zone — only when playing (invisible, full-area click to pause) */}
      {playing && (
        <div
          onClick={handleWrapperClick}
          style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
        />
      )}

      {/* Controls bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 14px 12px',
          background: 'linear-gradient(transparent,rgba(0,0,0,0.85))',
          transition: 'opacity 0.25s',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        {/* Seek bar */}
        <div
          onClick={seek}
          style={{
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#7c3aed',
              borderRadius: 2,
              transition: 'width 0.1s',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Play/Pause btn */}
          <button
            onClick={toggle}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {playing ? '⏸' : '▶'}
          </button>

          {/* Time */}
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              minWidth: 90,
            }}
          >
            {fmt(current)} / {fmt(duration)}
          </span>

          {/* Mute */}
          <button
            onClick={() => setMuted((m) => !m)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {playbackRate}x
          </button>

          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 600,
            }}
          >
            Umang Vision Academy
          </span>

          {/* Fullscreen */}
          <button
            onClick={toggleFS}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
};

// ── CoursePage ────────────────────────────────────────────────────────────────
export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSelector((s) => s.auth);

  const storageKey = `course-progress-${id}`;
  const savedState = useMemo(() => {
    if (typeof window === 'undefined' || !id) return null;
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch {
      return null;
    }
  }, [storageKey, id]);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIdx, setActiveIdx] = useState(savedState?.lastLesson ?? 0);
  const [completed, setCompleted] = useState(
    () => new Set(savedState?.completed ?? [])
  );
  const [currentVideoPct, setCurrentVideoPct] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCh, setExpandedCh] = useState(new Set([0]));

  // ── Lesson progress stored in a ref — does NOT cause re-renders ──────────
  // This is the key fix: progress saves don't re-render CoursePage or VideoPlayer
  const lessonProgressRef = useRef(savedState?.lessonProgress ?? {});

  // Frozen initialTime — only updates when activeIdx changes, NOT on every progress tick
  const [initialTime, setInitialTime] = useState(
    lessonProgressRef.current[savedState?.lastLesson ?? 0] || 0
  );

  useEffect(() => {
    // When lesson changes, snapshot the saved time for that lesson
    setInitialTime(lessonProgressRef.current[activeIdx] || 0);
    setCurrentVideoPct(0);
  }, [activeIdx]);

  // Throttled localStorage save (every 5s max)
  const saveTimer = useRef(null);
  const pendingSave = useRef({});

  const scheduleSave = useCallback(
    (patch) => {
      Object.assign(pendingSave.current, patch);
      if (saveTimer.current) return;
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        localStorage.setItem(storageKey, JSON.stringify(pendingSave.current));
      }, 5000);
    },
    [storageKey]
  );

  useEffect(() => {
    if (authLoading) return; // ← wait for auth to finish
    if (!user) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    api
      .get(`/courses/${id}`)
      .then(({ data }) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Course not found.');
        setLoading(false);
      });
  }, [id, user, authLoading, navigate]);

  // Save on unmount too
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      localStorage.setItem(storageKey, JSON.stringify(pendingSave.current));
    },
    [storageKey]
  );

  const chapters = groupIntoChapters(course?.lessons ?? []);
  const allLessons = course?.lessons ?? [];
  const activeLesson = allLessons[activeIdx];

  const handleLessonEnd = useCallback(() => {
    setCompleted((prev) => {
      const next = new Set([...prev, activeIdx]);
      scheduleSave({
        lastLesson: activeIdx,
        completed: Array.from(next),
        lessonProgress: lessonProgressRef.current,
      });
      return next;
    });
    if (activeIdx < allLessons.length - 1) setActiveIdx((i) => i + 1);
  }, [activeIdx, allLessons.length, scheduleSave]);

  // onProgress — uses ref, no setState for progress → no re-render of CoursePage
  const handleVideoProgress = useCallback(
    (pct, currentTime) => {
      setCurrentVideoPct(Math.round(pct)); // only this local state updates
      lessonProgressRef.current[activeIdx] = currentTime;

      setCompleted((prev) => {
        if (pct >= 90 && !prev.has(activeIdx)) {
          const next = new Set([...prev, activeIdx]);
          scheduleSave({
            lastLesson: activeIdx,
            completed: Array.from(next),
            lessonProgress: lessonProgressRef.current,
          });
          return next;
        }
        return prev;
      });

      scheduleSave({
        lastLesson: activeIdx,
        lessonProgress: lessonProgressRef.current,
      });
    },
    [activeIdx, scheduleSave]
  );

  const toggleChapter = (i) => {
    setExpandedCh((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const progressPct = allLessons.length
    ? Math.round((completed.size / allLessons.length) * 100)
    : 0;

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0b1120',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <p>Loading course…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0b1120',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 48 }}>😔</span>
        <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#7c3aed',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Go Back
        </button>
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b1120',
        color: '#f1f5f9',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          background: '#0d1526',
          borderBottom: '1px solid #1e293b',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <button
          onClick={() => navigate('/student-dashboard/my-courses')}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ← Courses
        </button>
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#f1f5f9',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {course?.title}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 120,
              height: 6,
              background: '#1e293b',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg,#7c3aed,#06b6d4)',
                borderRadius: 3,
                transition: 'width 0.5s',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            {progressPct}%
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#94a3b8',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {sidebarOpen ? 'Hide' : 'Show'} Content
        </button>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: '24px 24px 40px',
          }}
        >
          <VideoPlayer
            url={activeLesson?.videoUrl}
            poster={course?.thumbnailUrl}
            initialTime={initialTime}
            onEnded={handleLessonEnd}
            onProgress={handleVideoProgress}
          />

          {/* Lesson info */}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                  Lesson {activeIdx + 1} of {allLessons.length}
                </p>
                <h1
                  style={{
                    fontSize: 'clamp(18px,3vw,26px)',
                    fontWeight: 800,
                    color: '#f1f5f9',
                    lineHeight: 1.3,
                  }}
                >
                  {activeLesson?.title || 'Untitled Lesson'}
                </h1>
                {activeLesson?.chapterTitle && (
                  <p
                    style={{
                      fontSize: 12,
                      color: '#818cf8',
                      marginTop: 6,
                      fontWeight: 600,
                    }}
                  >
                    📂 {activeLesson.chapterTitle}
                  </p>
                )}
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  {currentVideoPct > 0
                    ? `Lesson progress: ${currentVideoPct}%`
                    : 'Start watching to track progress'}
                </p>
              </div>

              <button
                onClick={() =>
                  setCompleted((prev) => {
                    const n = new Set(prev);
                    n.has(activeIdx) ? n.delete(activeIdx) : n.add(activeIdx);
                    scheduleSave({
                      lastLesson: activeIdx,
                      completed: Array.from(n),
                      lessonProgress: lessonProgressRef.current,
                    });
                    return n;
                  })
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: `1px solid ${completed.has(activeIdx) ? '#16a34a' : '#334155'}`,
                  background: completed.has(activeIdx)
                    ? '#052e16'
                    : 'transparent',
                  color: completed.has(activeIdx) ? '#4ade80' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {completed.has(activeIdx) ? '✓ Completed' : 'Mark Complete'}
              </button>
            </div>

            {activeLesson?.description && (
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: 14,
                  lineHeight: 1.8,
                  marginTop: 14,
                }}
              >
                {activeLesson.description}
              </p>
            )}
          </div>

          {/* Prev / Next */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={activeIdx === 0}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 12,
                border: '1px solid #334155',
                background: 'transparent',
                color: activeIdx === 0 ? '#334155' : '#e2e8f0',
                fontWeight: 600,
                fontSize: 13,
                cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                setCompleted((p) => {
                  const next = new Set([...p, activeIdx]);
                  scheduleSave({
                    lastLesson: activeIdx + 1,
                    completed: Array.from(next),
                    lessonProgress: lessonProgressRef.current,
                  });
                  return next;
                });
                setActiveIdx(Math.min(allLessons.length - 1, activeIdx + 1));
              }}
              disabled={activeIdx === allLessons.length - 1}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 12,
                border: 'none',
                background:
                  activeIdx === allLessons.length - 1
                    ? '#1e293b'
                    : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: activeIdx === allLessons.length - 1 ? '#334155' : '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor:
                  activeIdx === allLessons.length - 1
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              Next →
            </button>
          </div>

          {/* About */}
          <div
            style={{
              marginTop: 32,
              background: '#111827',
              border: '1px solid #1e293b',
              borderRadius: 18,
              padding: '22px 24px',
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#f1f5f9',
                marginBottom: 12,
              }}
            >
              About this course
            </h3>
            <p
              style={{
                color: '#94a3b8',
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {course?.description || course?.summary}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                marginTop: 16,
              }}
            >
              {[
                { icon: '📚', label: `${allLessons.length} lessons` },
                {
                  icon: '👥',
                  label: `${course?.students?.length ?? 0} students`,
                },
                {
                  icon: '⭐',
                  label: `${course?.ratingAverage?.toFixed(1) ?? 'New'} rating`,
                },
                { icon: '📋', label: course?.board ?? '' },
              ]
                .filter((s) => s.label)
                .map((s) => (
                  <span
                    key={s.label}
                    style={{ fontSize: 13, color: '#64748b' }}
                  >
                    {s.icon} {s.label}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT: sidebar */}
        {sidebarOpen && (
          <div
            style={{
              width: 360,
              borderLeft: '1px solid #1e293b',
              background: '#0d1526',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              overflowY: 'auto',
              position: 'sticky',
              top: 57,
              height: 'calc(100vh - 57px)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1e293b',
                flexShrink: 0,
              }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                Course Content
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {chapters.length} chapters · {allLessons.length} lessons
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {chapters.map((chapter, ci) => (
                <div key={ci}>
                  <button
                    onClick={() => toggleChapter(ci)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      background: '#111827',
                      border: 'none',
                      borderBottom: '1px solid #1e293b',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#f1f5f9',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {chapter.title}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {chapter.lessons.length} lessons
                      </span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        {expandedCh.has(ci) ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {expandedCh.has(ci) &&
                    chapter.lessons.map((lesson) => {
                      const isActive = lesson.globalIdx === activeIdx;
                      const isDone = completed.has(lesson.globalIdx);
                      return (
                        <button
                          key={lesson.globalIdx}
                          onClick={() => setActiveIdx(lesson.globalIdx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '12px 20px 12px 28px',
                            background: isActive ? '#1e1b4b' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #1e293b1a',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: `2px solid ${isDone ? '#4ade80' : isActive ? '#7c3aed' : '#334155'}`,
                              background: isDone ? '#052e16' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            {isDone && (
                              <span style={{ color: '#4ade80', fontSize: 10 }}>
                                ✓
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? '#a78bfa' : '#e2e8f0',
                                lineHeight: 1.4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {lesson.title}
                            </p>
                            <div
                              style={{ display: 'flex', gap: 8, marginTop: 3 }}
                            >
                              <span style={{ fontSize: 11, color: '#475569' }}>
                                🎬 Video
                              </span>
                              {lesson.durationMinutes > 0 && (
                                <span
                                  style={{ fontSize: 11, color: '#475569' }}
                                >
                                  {fmtMins(lesson.durationMinutes)}
                                </span>
                              )}
                            </div>
                          </div>
                          {isActive && (
                            <span
                              style={{
                                color: '#7c3aed',
                                fontSize: 14,
                                flexShrink: 0,
                              }}
                            >
                              ▶
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
